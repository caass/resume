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

        pnpm = pkgs.pnpm_10;

        resume = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "resume";
          version = "0.0.1";

          # Narrow the source so unrelated files don't trigger rebuilds.
          src = lib.fileset.toSource {
            root = ./.;
            fileset = lib.fileset.unions [
              ./src
              ./package.json
              ./pnpm-lock.yaml
              ./astro.config.mjs
              ./tsconfig.json
              ./.puppeteerrc.cjs
            ];
          };

          nativeBuildInputs = [
            pkgs.nodejs
            pnpm
            pnpm.configHook
            chrome
          ];

          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit (finalAttrs) pname version src;
            inherit pnpm;
            fetcherVersion = 3;
            hash = "sha256-pBP1GHUVhlOyAL/1oJ8vrXgWvj4cdyu6HIMnUPDlrxw=";
          };

          env = {
            PUPPETEER_EXECUTABLE_PATH = chromePath;
            PUPPETEER_SKIP_DOWNLOAD = "true";
            ASTRO_TELEMETRY_DISABLED = "1";
          };

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
            pnpm exec astro build            # not `pnpm build` (that runs `open`)
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
        # tree, with node/pnpm/chrome and the browser env set up.
        dev = pkgs.writeShellApplication {
          name = "resume-dev";
          runtimeInputs = [
            pkgs.nodejs
            pnpm
            chrome
          ];
          text = ''
            export PUPPETEER_EXECUTABLE_PATH=${chromePath}
            export PUPPETEER_SKIP_DOWNLOAD=true
            # Don't prompt to purge a node_modules left by another pnpm/version;
            # there's no TTY when launched via `nix run`.
            pnpm install --config.confirm-modules-purge=false
            exec pnpm exec astro dev "$@"
          '';
        };
      in
      {
        packages.default = resume;

        apps.default = {
          type = "app";
          program = "${dev}/bin/resume-dev";
        };

        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs
            pnpm # pnpm_10, matching the package build
            chrome
          ];
          # Point Puppeteer/astro-pdf at the store browser, matching the Nix build.
          PUPPETEER_EXECUTABLE_PATH = chromePath;
          PUPPETEER_SKIP_DOWNLOAD = "true";
        };
      }
    );
}
