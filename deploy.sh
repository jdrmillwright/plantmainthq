#!/bin/bash
set -e
# Forward to the core ship pipeline
exec ./ship "$@"
