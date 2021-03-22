
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Tobii.Interaction;

using Tobii.Interaction.Framework;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace Interaction_Interactors_101
{
    /// <summary>
    /// Interactor is a region on the screen for which some gaze based behavior is defined.
    /// Most common behaviors the Tobii Core SDK is exposing for interactors is gaze aware
    /// (simply a notion of whether somebody is looking at the region or not), activatable
    /// (which means region has some action associated with it, which can be triggered, but
    /// only if someone is looking at it at the same time), pannable (provides panning like
    /// behavior with associated actions, which can be triggered, but again only if someone
    /// is looking at it at the same time). 
    /// 
    /// To help you manage interactors, the Tobii Core SDK provides another concept - InteractorAgents.
    /// When you do not work with WPF or WindowsForms, the Tobii Core SDK has UnboundInteractorAgent,
    /// which you can use to control everything related to interactors.
    /// 
    /// Gaze aware is the most basic behavior we could think of, so let's see how its easy to
    /// define 'you are looking at it' interactor with the Tobii Core SDK.
    /// </summary>
    public class Program
    {
        public class Laputa : WebSocketBehavior
        {
            FixationDataStream fixationDataStream;
            Host host;
            double fixationBeginTime;
            bool receivedEndFixation = true;

            protected override void OnMessage(MessageEventArgs e)
            {
                //string path = @"/Users/Kathryn Faolin/Documents/thesis/data.txt";
                ////string path = @"/Users/tim/Documents/data.txt";
                ////System.IO.File.AppendAllText(path, e.Data + Environment.NewLine);
                //if (e.Data == "pandas")
                //{
                //    System.IO.File.WriteAllText(path, e.Data);
                //}
                //Send(e.Data);
            }

            private void handleFixation(object sender, StreamData<FixationData> fixation)
            {
                // On the Next event, data comes as FixationData objects, wrapped in a StreamData<T> object.
                var fixationPointX = fixation.Data.X;
                var fixationPointY = fixation.Data.Y;

                switch (fixation.Data.EventType)
                {
                    case FixationDataEventType.Begin:

                        // Check to see if an end-fixation message was sent
                        if (!receivedEndFixation) {
                            string fixString = string.Format("duration|{0}|null",
                            fixationBeginTime > 0
                                ? TimeSpan.FromMilliseconds(fixation.Data.Timestamp - fixationBeginTime)
                                : TimeSpan.Zero);
                            receivedEndFixation = true;
                            Send(fixString);
                        }

                        fixationBeginTime = fixation.Data.Timestamp;
                        string beginString = string.Format("begin|{0}|{1}", fixationPointX, fixationPointY);
                        receivedEndFixation = false;
                        Send(beginString);
                        //Console.WriteLine(beginString);
                        break;

                    case FixationDataEventType.Data:
                        string duringString = string.Format("during|{0}|{1}", fixationPointX, fixationPointY);
                        Send(duringString);
                        break;

                    case FixationDataEventType.End:
                        string endString = string.Format("end|{0}|{1}", fixationPointX, fixationPointY);
                        Send(endString);
                        string fixString = string.Format("duration|{0}|null",
                            fixationBeginTime > 0
                                ? TimeSpan.FromMilliseconds(fixation.Data.Timestamp - fixationBeginTime)
                                : TimeSpan.Zero);
                        receivedEndFixation = true;
                        Send(fixString);
                        break;

                    default:
                        throw new InvalidOperationException("Unknown fixation event type, which doesn't have explicit handling.");
                }

            }

            protected override void OnOpen()
            {
                // Everything starts with initializing Host, which manages the connection to the 
                // Tobii Engine and provides all the Tobii Core SDK functionality.
                // NOTE: Make sure that Tobii.EyeX.exe is running
                host = new Host();
             
                // Initialize Fixation data stream.
                fixationDataStream = host.Streams.CreateFixationDataStream();

                // Because timestamp of fixation events is relative to the previous ones
                // only, we will store them in this variable.
                fixationBeginTime = 0d;
                
                Console.WriteLine(string.Format("stream opened at {0}", DateTime.Now));
                fixationDataStream.Next += handleFixation;

            }

            protected override void OnClose(CloseEventArgs e)
            {
                base.OnClose(e);
                Console.WriteLine(string.Format("stream closed at {0}", DateTime.Now));
                fixationDataStream.Next -= handleFixation;
            }
        }

        public static void Main(string[] args)
        {
            PrintSampleIntroText();
            var wssv = new WebSocketServer("ws://localhost:8765");
            wssv.AddWebSocketService<Laputa>("/hello");
            wssv.Start();
            Console.ReadKey(true);
            wssv.Stop();

            /*
            // Everything starts with initializing Host, which manages the connection to the 
            // Tobii Engine and provides all the Tobii Core SDK functionality.
            // NOTE: Make sure that Tobii.EyeX.exe is running
            var host = new Host();

            PrintSampleIntroText();

            // InteractorAgents are defined per window, so we need a handle to it.
            var currentWindowHandle = Process.GetCurrentProcess().MainWindowHandle;
            // Let's also obtain its bounds using Windows API calls (hidden in a helper method below).
            var currentWindowBounds = GetWindowBounds(currentWindowHandle);
            // Let's create the InteractorAgent.
            var interactorAgent = host.InitializeVirtualInteractorAgent(currentWindowHandle, "ConsoleWindowAgent");

            // Next we are going to create an interactor, which we will define with the gaze aware behavior.
            // Gaze aware behavior simply tells you whether somebody is looking at the interactor or not.
            interactorAgent
                .AddInteractorFor(currentWindowBounds)
                .WithGazeAware()
                .HasGaze(() => Console.WriteLine("Hey there!"))
                .LostGaze(() => Console.WriteLine("Bye..."));

            Console.ReadKey(true);

            // we will close the coonection to the Tobii Engine before exit.
            host.DisableConnection();
            */
            }

        #region Helpers 

            private static void PrintSampleIntroText()
            {
                Console.Clear();
                Console.WriteLine("============================================================");
                Console.WriteLine("|           Tobii Core SDK: Interactors                    |");
                Console.WriteLine("============================================================");

                Console.WriteLine();
                //Console.WriteLine("This sample will demonstrate you the usage of GazeAware interactors.");
                //Console.WriteLine("Look at the window to trigger HasGaze event and look away to trigger\n" +
                //                  "LostGaze event.");
                Console.WriteLine();
                //Console.WriteLine("HERE");
                Console.WriteLine("Server has started...");
            }

        private static Rectangle GetWindowBounds(IntPtr windowHandle)
        {
            NativeRect nativeNativeRect;
            if (GetWindowRect(windowHandle, out nativeNativeRect))
                return new Rectangle
                {
                    X = nativeNativeRect.Left,
                    Y = nativeNativeRect.Top,
                    Width = nativeNativeRect.Right,
                    Height = nativeNativeRect.Bottom
                };

            return new Rectangle(0d, 0d, 1000d, 1000d);
        }

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool GetWindowRect(IntPtr hWnd, out NativeRect nativeRect);

        [StructLayout(LayoutKind.Sequential)]
        public struct NativeRect
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        #endregion
    }
}
