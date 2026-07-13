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
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs
            pkgs.pnpm
            chrome
          ];
          # Point Puppeteer/astro-pdf at the store browser, matching the Nix build.
          PUPPETEER_EXECUTABLE_PATH = chromePath;
          PUPPETEER_SKIP_DOWNLOAD = "true";
        };
      }
    );
}
