# session-util

Session utilities for Claude Code. For now it adds one status line entry under the prompt:

```
cache 4:32 (1h) · hit 92% · ctx 45.2k/1.00M (5%)
```

- **cache m:ss (TTL)**: time left before the prompt cache expires, counted from the last main-conversation response (subagent calls don't reset it). Shows `cache expired` once it lapses.
- **hit %**: share of the last response's input tokens served from the cache.
- **ctx**: tokens in the context window / window size (percent used), the same figures as `/context`.

## Cache TTL

Claude Code doesn't expose the cache TTL to plugins, so it is inferred: 1h on a Claude subscription, 5m otherwise, switched to 1h when a cache hit is seen more than 5 minutes after the previous response. Override it in `/config` with the plugin's **Prompt cache TTL** option (`auto`, `5m`, `1h`).

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-util --marketplace m42cococa/cc-plugin
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```
claude plugin install session-util --marketplace m42cococa/cc-plugin
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `m42cococa/cc-plugin`, then **Add plugin**.

## Develop

```
claude plugin validate plugins/session-util
claude plugin test plugins/session-util
claude --plugin-dir plugins/session-util
```
