{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-21.11.tar.gz") {} }:

pkgs.mkShell {
	LOCALE_ARCHIVE_2_27 = "${pkgs.glibcLocales}/lib/locale/locale-archive";
	buildInputs = [
		pkgs.glibcLocales
		pkgs.wget
		pkgs.nodejs-16_x
		pkgs.yarn
		pkgs.gnumake
	];
	shellHook = ''
		export LC_ALL=en_US.UTF-8
		export PATH=$PWD/node_modules/.bin:$PATH
	'';
}
