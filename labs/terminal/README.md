# Terminal Dungeon room layers
One Dockerfile per room (Dockerfile.<roomId>), each FROM breachkeep/base.
The flag is injected as BK_FLAG and written where the room expects it.
Rooms to build weekly (see spec section 10): first-steps, reading, finding,
hidden, grep, pipes(+checker), perms, env(+checker), scripts(+checker), escalation.
