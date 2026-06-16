---
title: How to use Vue2 with Vite 8+
layout: post
description: Our new NPM package maintains Vue.js 2.7 build capabilities for Vite 8+, thanks to the Vue2 community
subject: "open source"
tags:
    - vue.js
    - vite
    - open source
    - github
---

Vue2 is officially deprecated, and the [vue2 Vite plugin](https://github.com/vitejs/vite-plugin-vue2) has been officially archived on GitHub. This is the official end-of-the-line for Vue2 support in Vite, and cuts off users from using any version of Vite greater than 5.x.x.

tl;dr - we've published [vite-ng-plugin-vue2](https://www.npmjs.com/package/vite-ng-plugin-vue2). Use it for vite8 Vue2 builds.

## The Vue2 community upgraded the plugin

In spite of Vue2's end-of-life, many members of the community have been asking for, and delivering, Vite8 compatibility for the Vue2 plugin, such as [BALOTIAS](https://github.com/vitejs/vite-plugin-vue2/issues/117#issuecomment-4351522471).

None of these pathches or pull requests has been merged into the official Vue2 plugin, so it remains unusable.


## Use vite-ng-plugin-vue2 instead

I work full time on [Beekeeper Studio](https://beekeeperstudio.io), an open source SQL GUI and database manager built in part using Vue.js 2.7. We're working to upgrade, but it's a mountain of work as so many APIs have been changed or removed.

In the meantime, we also wanted to upgrade to Vite 8, but were unable to.

Instead we've taken BALOTIAS' Vite8 fixes and released them as part of a new NPM package - [vite-ng-plugin-vue2](https://www.npmjs.com/package/vite-ng-plugin-vue2). It's a drop-in replacement for the abandoned `vite-plugin-vue2`.

The code is fully [open source on GitHub](https://github.com/beekeeper-studio/vite-ng-plugin-vue2). We've also upgraded a bunch of out of date dependencies, and will continue to improve the project moving forwards. Full credit to BALOTIAS and the other members of the Vue2 community for this code. I'm simply packaging it.

## Open to issues and PRs

The Beekeeper Studio team and I maintain open source projects for a living, so we're happy to receive issues and PRs for this library.

I hope, if you are reading this, that you can use our library for your Vue2 project. Please help us maintain it!

## Why aren't VoidZero interested in merging patches?

[VoidZero](https://voidzero.dev/), the company that was founded by Evan You and which now controls the development of both Vite and Vue.js have done a great job with Vite and Vue.JS, but they have made it clear that they are unwilling to maintain Vite compatibility with the legacy (EoL) Vue.js 2.0 codebase.

VoidZero control both Vue and Vite, so this is a deliberate choice by them. I'm sure resources are tight, but the decision is painful given the difficult upgrade path between Vue.js 2 and Vue.js 3.

If anyone on the VoidZero team reads this post - linking to this package (or another), or possibly leaving a note in the README would be much appreciated and helpful for others who are stuck with Vue.js 2.7 for a while longer.


Either way, I hope if you read this article you find our new library useful. Hope to see you [on GitHub](https://github.com/beekeeper-studio/vite-ng-plugin-vue2)


Have a great day,

Matthew
