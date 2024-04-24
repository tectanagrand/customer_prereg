#!/bin/bash
if [ -w /etc/hosts ]; then
  echo "172.22.2.99 erpdev-gm erpdev-gm.gamasap.com" >> /etc/hosts
fi
exec "$@"