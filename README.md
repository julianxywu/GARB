# GARB: Gaze-Aware Reading-aid for the Browser
## Julian Wu (Research under Professor Tim Tregubov)

### What is GARB?
GARB stands for "Gaze-Aware Reading-aid for the Browser," which allows users to track their online reading through an eye tracking device.
Through the use of an extension to simplify webpages and get rid of distracting elements (ads, primarily), users will be able to have more focus when reading.
There is also highlighting of lines to track user progress and collect data on the user's reading ability.

### Requirements
1. Software requirements:
    * Visual Studios 2019 (https://visualstudio.microsoft.com/downloads/)
    * Google Chrome Browser
2. Hardware requirements:
    * Tobii 4C Eyetracking device (https://gaming.tobii.com/product/tobii-eye-tracker-4c/)

### Setup
1. Clone the repo locally and open it with Visual Studios.
`git clone https://github.com/julianxywu/GARB.git`
2. Activate the extension
    * go to `chrome://extensions` and reload the extension by clicking Load Unpacked, and selecting/opening the `extension` folder/directory in the repo.
    * Test it out by going to any web page (you can just use Wikipedia) and switch on the extension by clicking the relevant icon and "Activate."

### How To Run:
1. Make sure all the steps from __Setup__ are followed!
2. Turn on Tobii Eyetracking and calibrate. 
3. From the top navigation bar, run the program `Main\Interaction_Interactors_101.csproj`. You can set the project configuration (right next to the start button) to `Debug|AnyCPU`.
4. You should see a terminal pop up with the message, "Server has started..."
5. Now open up a webpage, use the extension on it, and you should see lines of text being highlighted in blue from your eye movement!