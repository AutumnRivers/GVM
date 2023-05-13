import cli from 'prompts';

import { execFile } from 'child_process';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);

// Medium Sized Function For Listing The Currently Installed Godot Versions (MSFLTCIGV)
const listPackages = async () => {
    console.clear();

    let installedVersions = []; // Keep track of the index of the user's choice
    let godotFiles = []; // Keep track of all the paths of the files

    let index = 0;

    // Read all of the currently installed versions
    const versionsArr = await fs.readdir(path.join(__dirname, '../godot/'));

    // Push each version to an array
    versionsArr.map(v => {
        installedVersions.push({
            title: v,
            value: index
        })

        index++;

        godotFiles.push(path.join(__dirname, '../godot/' + v + '/'));
    })

    // Ask user which version they want to launch
    const launchVersion = await cli({
        type: 'select',
        message: "Currently Installed Versions",
        hint: "Select a Godot version to launch...",
        name: 'index',
        choices: installedVersions,
        initial: 0
    });

    if(!launchVersion.index) return; // In case the user cancels

    // Find ALL the files for the version
    const files = await fs.readdir(godotFiles[launchVersion.index]);

    // Find the main exe file, not the console one
    const exFile = path.join(__dirname, `../godot/${versionsArr[launchVersion.index]}/${files.filter(f => f.endsWith('.exe') && !f.includes('console'))[0]}`);

    console.log("Excellent choice! Launching Godot...");

    // Launch file
    execFile(exFile);
}

export default listPackages;