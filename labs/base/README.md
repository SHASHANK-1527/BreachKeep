# base image
Build once:  docker build -t breachkeep/base labs/base
Every interactive room image starts FROM breachkeep/base and adds only its own
files/permissions/binary. The provisioner injects the per-student flag as BK_FLAG.
