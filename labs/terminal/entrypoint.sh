#!/bin/bash
echo "${BK_FLAG:-BK{dev-placeholder}}" > /home/student/vault/inner/flag.txt
exec ttyd -p 7681 -i 0.0.0.0 bash
