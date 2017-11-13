

using System;

namespace HelloWorld
{
    internal class Program
    {
        private static byte[] dane = new byte[10] {1, 1, 0, 1, 1, 1, 1, 1, 1, 1 };
        
        public static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");
            Console.WriteLine("Press any key to exit");
            Console.ReadKey();

        }
    }
}