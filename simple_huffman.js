PriorityQueue = require('js-priority-queue');
fs = require('fs')

class node {
    constructor(char, value, left, right){
        this.char = char;
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

/**
 * Build a frequency table 
 * @param {*} inputString 
 */
function createFrequencyTable(inputString){
    let frequencyTable = {};  
    inputString.split("").forEach(e =>{
        isNaN(frequencyTable[e]) ? frequencyTable[e] = 1 : frequencyTable[e] ++;
    });
    return frequencyTable;
}

/**
 * Return a Priority Queue (min heap) data struct with the initial nodes 
 * @param {*} freqTable 
 * @returns 
 */
function buildPriorityQueue(freqTable){
    let huffmanNodes = [];
    for (let [key, value] of Object.entries(freqTable)) {
      huffmanNodes.push(new node(key, value, null, null));
    }
   myPriorityQueue = new PriorityQueue({comparator: function(a, b) { return a.value - b.value; }});
   huffmanNodes.forEach( e => {
     myPriorityQueue.queue(e);
   })
   return myPriorityQueue;
}

/**
 * Gets the 2 min frequency nodes from the priority queue, create a new node with 
 * the summed value. Loop until the queue is empty. Return the Huff tree
 * @param {*} priorityQueue 
 * @returns  
 */
function buildHuffmanTree(priorityQueue){
    while (priorityQueue.length != 1) {
        let leftChild =priorityQueue.dequeue(); // Get the 2 minimum frequency nodes
        let rightChild =priorityQueue.dequeue();
        let newValue = leftChild.value + rightChild.value; 
        let internalNode = new node("INTERNAL", newValue, leftChild, rightChild); // Add a placeholder string to identify non leaf nodes
        priorityQueue.queue(internalNode);
      }
      return priorityQueue.dequeue();
}

/**
 * Traverse the Huff tree: add 0 to the code when a left child is visited, add 1 
 * when a right child is visited. Returns a {key : binary chars} dict 
 * @param {*} tree 
 * @returns 
 */
function recursiveTraversal(tree){
  let codeDictionary = {}; 
  let traverse = (node, path) => { 
      if (!tree) { 
        return;  
      }
      if (node.char != "INTERNAL"){  // if is a leaf, add add the {symbol : binary char sequence} to the dict
        codeDictionary[node.char] = path
      }
      if(node.left){  
          traverse(node.left, path + '0');  
      }  
      if(node.right){  
          traverse(node.right, path + '1');  
      }  
  };  
  traverse(tree, ''); 
  return codeDictionary;  
}

/**
 * Translate the input message chars in 0 and 1s basing on the codeDict (but 
 * they are still chars here). Pad with 0s if the result string lenght is not 
 * multiple of 8
 * @param {*} arr 
 * @param {*} codes 
 * @returns 
 */
function encode(arr,code){
  let strArr = arr.map(char => {
    return code[char].toString();
  })
  binaryStr = strArr.join("");
  let padLen = 8 - binaryStr.length % 8;
  for (let i = 0; i < padLen; i++) {
    binaryStr += "0";
  }
  return binaryStr;
}

/**
 * Recover the original message from the received array of binaries chars using 
 * our code dictionary
 * @param {*} binaryStr 
 * @param {*} code
 * @returns 
 */
function decode(binaryStr, code){
  let arr = binaryStr.join("").split(""); // from arrays of len 8 to arrays of len 1
  let decoded = [];
  let cur = "";
  for(let i=0; i<arr.length;i++){ // Foreach element of the splitted binary arr 
    let bit = arr[i];
    cur += bit; // Add to the current sequence
    for (let key in code){ // If the current sequence is in the code, add the corresponding key to the decoded string
      if (code[key] === cur){
        if (key === eof){ // There are some trailing 0s at the end of the last byte so we need to stop at the 
          break;          // EOF, otherwise some "garbage" symbols will be attached to our decoded string
        }
        decoded.push(key);
        cur = "";
      }
    }
  }
  console.log(`Decompressed ${arr.length / 8} bytes to ${decoded.length} bytes`);
  return decoded;
}

/**
 * Actually translating the sequence of 0 and 1 chars in a Uint8Array buffer 
 * that can be written to disk. 
 * First split the string into 8 char sequences, then parse these sequences 
 * into decimal values, finally put them into a Uint8Array buffer.
 * @param {*} original 
 * @returns 
 */
function writeBuffer(original){
  let stringBytes = original.match(/.{1,8}/g);
  let numBytes = stringBytes.map(bitSequence => {
    return parseInt(bitSequence, 2)
  });
  let buffer = Uint8Array.from(numBytes);
  console.log(`Compressed ${initialMessage.length} bytes to ${buffer.length} bytes`)
  return buffer;
}

/**
 * Read the buffer: transform the uInt8 array in an array of binary strings, 
 * pad the strings shorter than 8 and return the array.
 * @param {*} buffer 
 * @returns 
 */
function bufferToBinaryCharsArr(buffer){
  let binarized = [...buffer].map(element => {
    return element.toString(2);
  });
  let padded = binarized.map(element => {
    return element.padStart(8,0);
  });
  return padded;
}

/**
 * Sync (blocking) write to file function
 * @param {*} arrayBuffer 
 */
function writeToFile(arrayBuffer){
  fs.appendFileSync("output", Buffer.from(arrayBuffer));
}

/**
 * Sync (blocking) read from file function
 * @returns 
 */
function readFromFile(){
  try {  
    var data = fs.readFileSync('output', null); //null in the encoding arg to get a buffer
    return data;
  } catch(e) {
    console.log('Error:', e.stack);
  }
}

/**
 * Search for a valid EOF in the printable standard ascii. If no character is 
 * available, terminates the program.
 * @param {*} initialMessage 
 * @returns 
 */
function getEOF(initialMessage){
  let eof;
  console.log("Checking in printable standard ascii");
  for(let i=32;i<127;i++){
    if (initialMessage.indexOf(String.fromCharCode(i)) == -1){
      console.log("Found ascii char not in string: " + String.fromCharCode(i) + " at index: " + i);
      eof = String.fromCharCode(i);
      break;
    }
  }
  if (!eof){
    console.log("No usable character! Terminating");
    process.exit()
  }
  return eof;
}

/**
 * Remove the output file
 */
function removeFiles(){
  try {
    fs.unlinkSync("output");
    console.log("File removed:", "output");
  } catch (err) {
    console.error(err);
  }
}

//////////////////// Testing ///////////////////// 
let fileName = "input_files/dagon.txt" 
//let fileName = "input_files/short_text.txt" 
//let fileName = "input_files/more_symbols_testing.txt" 
//let fileName = "input_files/printable_ascii.txt" 

// read initial message from file
try {  
  var data = fs.readFileSync(fileName, 'utf8');
  initialMessage = data.toString();
} catch(e) {
  console.log('Error:', e.stack);
}
console.log("initialMessage: ", initialMessage);

// find a viable EOF
let eof = getEOF(initialMessage);
initialMessage+=eof;

// encode
frequencyTable = createFrequencyTable(initialMessage);
priorityQueue = buildPriorityQueue(frequencyTable);
console.log("priority queue: ", priorityQueue);
myHuffmanTree = buildHuffmanTree(priorityQueue)
console.log("huffman tree:", myHuffmanTree);
code = recursiveTraversal(myHuffmanTree);
console.log("code:", code);
encoded = encode(initialMessage.split(""), code)
console.log("binary encoded: ", encoded);
buffer = writeBuffer(encoded);
console.log("to buffer:", buffer);
writeToFile(buffer);

// decode
retreivedBuffer = readFromFile();
console.log("buffer from file:", retreivedBuffer);
retreived = bufferToBinaryCharsArr(retreivedBuffer);
console.log("code from buffer:", retreived);
decoded = decode(retreived, code);
console.log("decoded message!", decoded.join(""));
console.log("end");

// clean
removeFiles();