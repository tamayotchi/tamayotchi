%{
  title: "Migrating biome",
  description: "Let's learn how to say hello world"
}
---

# Introduction


## Problem?

eslint and 
## Why biome?

(Add some points)

I talked with my boss and my team, and they really like the idea but we don't have any capacity for do it, so I say: I will do it in my free-time. And he didn't like the idea but allowed to me to do it.

I was doing manual PR with Claude help to do the migration but then I saw this post bun[https://bun.com/blog/bun-in-rust#just-be-really-smart-and-don-t-make-mistakes]
So I was like, oh no hell, This looks like a good idea and I should do it with some harness to avoid manual work and this could work to migrate another repos

So this migration should compleing this points:

# No DOWN TIME is allowed for this change (imagine explain to the client that the server was down since we was migrating the linter)

# incremental rewrite, it does not block our features, is not allowed do it in 1 PR

# It should create max 2 PRs and then create another 2 after the previous were completed (This is because our team is small (4 people) we don't want to load the team with this kind on changes, we want to be less obstructive)

# Manual changes (biome can not fix it) should be in another PR (for review careful, we don't want to change the current behavior of a function)


So the first plan was separate it by parts, so with claude help I created some tasks to do the migrations by folder and the PR should contain < 500 lines of code edited.

(add image)


# How

Like I said, I did some manual work, the idea was to have `.eslintignore` and `.prettierignore` then when new files were added to biome add it in `biome.includes.json`

It has this structure:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "files": {
    "includes": [
      "biome.json",
      "biome.includes.json",
      ...
    ]
  }
}
```

## Harness Engineer


So the first idea is to create a mini service that will listen the github changes (to see if the 2 PRs are migrated) and then create the new ones. 
It looks very simple, right?

We have ~30 tasks, migrating first `src/interactors/some_path/**.ts` and `test/interactors/some_path/**.ts` to acomplish that every PR should contain < 500 lines edited

So I will have to create a document to explicity how claude should fix the manual changes



# Benchmarks

(I will do it in the last step)

Macbook M5 Pro with 24 GB RAM:

Lenovo Legion 5:


## For compleing upside if we need

# The repo is the most important in the company, if we are down all the clients are going to have down time

# The repo has ~300.000 lines
