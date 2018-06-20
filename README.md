# vault-build-client

A user-friendly command line client for the vault-build REST API.

# Usage

    $ bin/index.js --help

      Usage: index [options] [command]

      Options:

        -V, --version                              output the version number
        -h --host <host>                           Specify the host of the vault-buildserver (default 'localhost' (default: localhost)
        -p --port <port>                           Specify the port of the vault-build server (default 3000 (default: 3000)
        -s --secure                                Specify the secure protocol (https)
        -v --verbose                               Be noisy
        -h, --help                                 output usage information

      Commands:

        login|l
        logout
        list-users|lu
        create-user|cu [options] <email>
        complete-registration|cr <token>
        enable-user|eu [options] <email>
        remove-user|ru [options] <email>
        list-packages|lp [options]
        create-package|cp [options] <app-version>
        show-package|sp <package-id>
        remove-package|rp [options] <package-id>

