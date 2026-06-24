{
  description = "hibi-api";
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
        name = "hibi-api";
        src = ./.;
        npmDepsHash = "sha256-raFZZYXdTMRw6mU5/k7lFZHJo/N6Soml59Q3TiNtdA8=";
        nodejs = pkgs.nodejs_24;
        installPhase = ''
          mkdir -p $out/lib/hibi-api $out/bin
          cp -r dist node_modules package.json $out/lib/hibi-api/
          cat > $out/bin/hibi-api <<EOF
          #!${pkgs.runtimeShell}
          exec ${pkgs.nodejs_24}/bin/node $out/lib/hibi-api/dist/index.js "\$@"
          EOF
          chmod +x $out/bin/hibi-api
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
