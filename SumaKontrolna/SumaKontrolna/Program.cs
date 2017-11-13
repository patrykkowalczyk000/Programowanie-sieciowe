

using System;
using System.Security.Cryptography;
using System.Threading;

namespace HelloWorld
{
    internal class Program
    {
        private static byte[] dane = new byte[10] {1, 1, 1, 1, 1, 1, 1, 1, 1, 1 };
        
        public static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");
            
            Console.WriteLine("Kontrola parzystosci bitu danych");
            Console.WriteLine(dane);
            Console.WriteLine("Wynik");
            Console.WriteLine( Program.CountBits(dane));
            
        }

        public static int CountBits(byte[] dane)
        {
            var i = 0;
            var j = 0;
            var b = 0;

            for (i = 0; i < dane.Length; i++)
            {
                for (j = 0; j < 8; j++)
                {
                    if ( 1 == Program.GetBit(dane[i], j))
                    {
                        b++;
                    }
                }
                
            }

            return (b % 2 == 0) ? 1 : 0;
        }

        public static int GetBit(byte b, int bitNumber)
        {
            return Convert.ToInt32(b & (1 << bitNumber - 1));
        }
    }
}