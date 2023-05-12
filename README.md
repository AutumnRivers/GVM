<center>
    <h1>Godot Version Manager</h1>
    <p>No more Searching for Godot. <sup>(That was the name of the play, right?)</sup></p>
</center>

---

## What is this?
A result of my personal frustrations and overcomplicating a simple problem.

In all seriousness, this is a project that allows you to download different versions of Godot, and keep them all in one place. If you couldn't tell by the name, the project is inspired by [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm).

I made this because I'm messy and throw my downloaded files everywhere. I know, it's a me problem. But this tidies things up quite nicely!

## What's supported?
Currently, GVM is made for Windows. And by that, I mean, it looks for Windows executables. You can still download builds for other platforms - as long as they're officially supported by Godot - but you can't launch them from the program... yet. It'll be a thing in the future, no worries!

You also can't download alphas, betas, and release candidates yet. Haven't gotten around to properly supporting subdirectories of the repository yet.

---

## Requirements

* NodeJS 18+
* Yarn 3
* Internet connectivity

---

## Features

* Download any officially supported platform builds of Godot - of *any* stable version. (Yes, that includes pre-3.0!)
* Option to download export templates with the engine download
* Launch any GVM-downloaded Godot versions
