import cli from 'prompts';

import download from './modules/download_new.js';
import listPackages from './modules/list_downloaded.js';

console.clear();

// What does the user want to do?
const whatToDo = cli({
    type: 'select',
    name: 'selection',
    message: 'GVM (Godot Version Manager)',
    hint: "Hello there! Select what you'd like to do...",
    choices: [
        {
            title: 'Download New Godot Packages',
            value: 'download'
        },
        {
            title: 'List Currently Installed Packages',
            value: 'listpackages'
        }
    ]
});

if(whatToDo.selection == 'download') download();
if(whatToDo.selection == 'listpackages') listPackages();

console.clear();