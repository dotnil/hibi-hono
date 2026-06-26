{
  description = "hibi-hono";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {inherit system;};
    in {
      packages.default = pkgs.buildNpmPackage {
        name = "hibi-hono";
        src = ./.;
        npmDepsHash = "sha256-W8M3GSM0iq890ru6IMvzlpCHdM7qa0tJvCV5M/XkQJc=";
        nodejs = pkgs.nodejs_24;
        installPhase = ''
          mkdir -p $out/lib/hibi-hono $out/bin
          cp -r dist node_modules package.json $out/lib/hibi-hono/
          cat > $out/bin/hibi-hono <<EOF
          #!${pkgs.runtimeShell}
          exec ${pkgs.nodejs_24}/bin/node $out/lib/hibi-hono/dist/index.js "\$@"
          EOF
          chmod +x $out/bin/hibi-hono
        '';
      };

      devShell = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_24
          pkgs.dbmate
        ];

        DATABASE_URL = "postgres://postgres:@localhost:5432/hibi?sslmode=disable";
      };
    });
}
