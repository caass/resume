{
  description = "Astro resume that renders to a PDF via a Nix-supplied Chrome";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        lib = nixpkgs.lib;

        # chromium is free software, so check its platform support against a
        # default-config pkgs set (this also avoids a config-eval cycle below).
        chromiumSupported =
          let
            free = nixpkgs.legacyPackages.${system};
          in
          lib.meta.availableOn free.stdenv.hostPlatform free.chromium;

        pkgs = import nixpkgs {
          inherit system;
          # Permit google-chrome, and only where chromium isn't available.
          config.allowUnfreePredicate =
            pkg: !chromiumSupported && lib.getName pkg == "google-chrome";
        };

        chrome = if chromiumSupported then pkgs.chromium else pkgs.google-chrome;
        chromePath =
          if chromiumSupported then lib.getExe chrome else "${chrome}/bin/google-chrome-stable";

        # Contact details for the resume live in the gitignored .env, so they're
        # neither committed nor visible to the pure flake source. Read them from
        # the ambient environment instead: `builtins.getEnv` returns "" under the
        # default pure eval (so a plain `nix build` just omits them — the
        # astro:env fields are optional), and returns the real values under
        # `nix build --impure`. Inject only the ones that are set. To bake them
        # in, run:  set -a; source .env; set +a; nix build --impure
        resumeEnv = lib.filterAttrs (_: v: v != "") {
          PHONE_NUMBER = builtins.getEnv "PHONE_NUMBER";
          EMAIL_ADDRESS = builtins.getEnv "EMAIL_ADDRESS";
        };

        # astro warns about missing contact details too, but that runs inside the
        # build sandbox, whose log Nix hides unless the build fails or you pass
        # `-L`. So also warn at eval time (which always reaches the terminal) when
        # a var is absent. Under the default pure eval builtins.getEnv returns ""
        # for both, so a plain `nix build` always reminds you to go impure.
        missingContact = lib.subtractLists (lib.attrNames resumeEnv) [
          "PHONE_NUMBER"
          "EMAIL_ADDRESS"
        ];

        resume = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "resume";
          version = "0.0.1";

          # Narrow the source so unrelated files don't trigger rebuilds.
          src = lib.fileset.toSource {
            root = ./.;
            fileset = lib.fileset.unions [
              ./src
              ./package.json
              ./package-lock.json
              ./astro.config.ts
              ./tsconfig.json
              ./.puppeteerrc.cjs
            ];
          };

          nativeBuildInputs = [
            pkgs.nodejs
            pkgs.npmHooks.npmConfigHook
            chrome
          ];

          npmDeps = pkgs.fetchNpmDeps {
            inherit (finalAttrs) pname version;
            src = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [
                ./package.json
                ./package-lock.json
              ];
            };
            hash = "sha256-FI5w0N5sdtPncIHbI8L1aq/e+o27X6ZgSSnwiIGE6ic=";
          };

          # astro-pdf ships a `preinstall: npx only-allow pnpm` hook that both
          # needs the network and rejects npm. We don't need any dependency's
          # lifecycle scripts here — esbuild/sharp/puppeteer all resolve to
          # prebuilt platform packages — so skip scripts for both the `npm ci`
          # and the `npm rebuild` that npmConfigHook runs.
          npmFlags = [ "--ignore-scripts" ];

          env = {
            PUPPETEER_EXECUTABLE_PATH = chromePath;
            PUPPETEER_SKIP_DOWNLOAD = "true";
            ASTRO_TELEMETRY_DISABLED = "1";
          } // resumeEnv;

          buildPhase = ''
            runHook preBuild
            # Chrome needs a writable HOME, and on macOS it resolves its
            # user-data dir (~/Library/Application Support) through CoreFoundation,
            # which reads CFFIXED_USER_HOME rather than $HOME. Nix builds run as a
            # daemon user with no real home, so without this Chrome fatals with
            # "Failed to get the path for 1001" (chrome::DIR_USER_DATA).
            export HOME=$(mktemp -d)
            export CFFIXED_USER_HOME=$HOME
            test -x "$PUPPETEER_EXECUTABLE_PATH"   # fail loud if our browser is missing
            echo "using browser: $PUPPETEER_EXECUTABLE_PATH"
            npm exec -- astro build          # not `npm run build` (that runs `open`)
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            install -Dm644 dist/resume.pdf $out/resume.pdf
            runHook postInstall
          '';

          doInstallCheck = true;
          installCheckPhase = ''
            runHook preInstallCheck
            test -s $out/resume.pdf
            runHook postInstallCheck
          '';
        });

        # `nix run .` — the Astro dev server (live reload) against the working
        # tree, with node/npm/chrome and the browser env set up.
        dev = pkgs.writeShellApplication {
          name = "resume-dev";
          runtimeInputs = [
            pkgs.nodejs
            chrome
          ];
          text = ''
            export PUPPETEER_EXECUTABLE_PATH=${chromePath}
            export PUPPETEER_SKIP_DOWNLOAD=true
            npm install --no-fund --no-audit
            exec npm exec -- astro dev "$@"
          '';
        };
      in
      {
        packages.default = lib.warnIf (missingContact != [ ])
          "resume: building without ${lib.concatStringsSep " and " missingContact} — the PDF will omit that contact info. Run `set -a; source .env; set +a; nix build --impure` to include it."
          resume;

        apps.default = {
          type = "app";
          program = "${dev}/bin/resume-dev";
        };

        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs # bundles npm, matching the package build
            chrome
            pkgs.just # task runner; see ./justfile (`just` lists recipes)
          ];
          # Point Puppeteer/astro-pdf at the store browser, matching the Nix build.
          PUPPETEER_EXECUTABLE_PATH = chromePath;
          PUPPETEER_SKIP_DOWNLOAD = "true";
        };
      }
    );
}
