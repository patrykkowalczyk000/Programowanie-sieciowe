

using System;
using System.Security.Cryptography;
using System.Threading;

namespace HelloWorld
{
    internal class Program
    {
        private static byte[] dane = new byte[10] {1, 0, 0, 0, 0, 0 ,0 ,0 ,0 , 0 };
        
        public static void Main(string[] args)
        {
            Console.WriteLine("CRC");
            
            
            Console.WriteLine(Program.Crc(dane));
            
        }

        public static int GetBit(byte b, int bitNumber)
        {
            return (int)(b & (1 << bitNumber - 1));
        }

        public static int Crc(byte[] dane)
        {
            var crc16 = 0xFFFF;
            var i = 0;
            var j = 0;
            
            
            for (i = 0; i < dane.Length; i++)
            {
                crc16 = dane[i] ^ crc16;
                
                for (j = 0; j < 8; j++)
                {
                    
                    if (1 == Program.GetBit((byte)crc16, 1))
                    {
                        crc16 = crc16 >> 1;
                        crc16 = crc16 ^ 0xA001;
                    }
                    else
                    {
                        crc16 = crc16 >> 1;
                    }
                }

                
            }
            return crc16;
        }
    }
}