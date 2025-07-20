#!/bin/bash

git push client-origin `git subtree split --prefix=client feature/chat`:master --force
git push server-origin `git subtree split --prefix=server feature/chat`:master --force
