**A simple implementation of the Huffman Encoding written in Node Js.**

Usage:
`
git clone https://github.com/andrematt/simple_huffman.git \n
npm install  \n
node my_huff.js  \n
`

The program search in the standard printable ASCII for a character not used 
in the input text to be used as EOF, therefore it will terminate without 
encoding if a text that uses all ASCII chars is given as input. 

To test with different files, comment/uncomment the "fileName" variables
starting from line 224. 


