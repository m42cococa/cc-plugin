# cc-plugin

A Claude Code plugin marketplace.

## Plugins

| Plugin | What it does |
| --- | --- |
| [session-util](plugins/session-util) | Status line showing the prompt-cache TTL countdown, cache hit percentage, and context size |

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
