 /*
 * [js-qetag]{@link https://github.com/soxueren/js-qetag}
 *
 * @version 0.6.0
 * @author Jin, Xuewen [emn178@gmail.com]
 * @copyright Jin, Xuewen 2018-2019
 * @license MIT
 */
/*jslint bitwise: true */
  (function() {
    'use strict';
    var root = typeof window === 'object' ? window : {};
    var NODE_JS = !root.JS_SHA1_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
    if (NODE_JS) {
      root = global;
    }
    var COMMON_JS = !root.JS_SHA1_NO_COMMON_JS && typeof module === 'object' && module.exports;
    var AMD = typeof define === 'function' && define.amd;


 var qetag = function(buffer, file, cb, pgcb, sha1String, index, blockfile){
    // sha1算法
    var shA1 = sha1.digest;

    // 以4M为单位分割
    var blockSize = 4 * 1024 * 1024;
    var prefix = 0x16;
    var blockCount = 0;
    var sha1String = [];


    if (buffer) {
        let bufferSize = buffer.size || buffer.length || buffer.byteLength;
        blockCount = Math.ceil(bufferSize / blockSize);
        for (let i = 0; i < blockCount; i++) {
            sha1String.push(shA1(buffer.slice(i * blockSize, (i + 1) * blockSize)));
        }
    }

    if (file) {
        let totalsize = file.size;       
        blockCount = Math.ceil(totalsize / blockSize);
        if (index == undefined && blockfile == undefined) {
            index = 0;
        }       
        let starttime = Date.now();

        let step = blockCount < 21 ? 1 : blockCount > 100 ? blockCount > 500 ? blockCount > 1000 ? 23 : 11 : 7 : 3;       
        let hashindex=[];
        for (let i = 0; i < blockCount-1; i += step) {
            hashindex.push(i);
        }
        hashindex.push(blockCount-1);     

        for(let i in hashindex){
            let reader = new FileReader();
            reader.id = i;
            reader.name = file.name;   
            reader.count = hashindex.length;
            reader.start = 0;
            reader.startbt = 0;
            blockfile = file.slice(hashindex[i] * blockSize, (hashindex[i] + 1) * blockSize);           
            reader.onload = (e) => {              
                let buffer = e.currentTarget.result;
                sha1String[i] = shA1(buffer);                
                if (Object.getOwnPropertyNames(sha1String).length > hashindex.length) {
                    console.log("读取结束",'step:' + step + ' end:' + i,sha1String,(Date.now() - starttime));
                    if (cb) {
                        cb(calcEtag());
                    }
                }
            }
            reader.readAsArrayBuffer(blockfile);
            reader.onloadend = (e) =>{
                if(pgcb){ pgcb(e); }
            } 
            reader.onprogress = progress;
        }      
    }

    function progress(evt) {
        if (evt.lengthComputable) {
              let percentLoaded = (evt.loaded / evt.total) * 100;           
              let reader = evt.currentTarget;
              let speed = (evt.loaded - reader.startbt) / (evt.timeStamp - reader.start);            
              reader.start = evt.timeStamp;
              reader.startbt = evt.loaded;
             console.log(reader.id+'/'+reader.count, reader.name, percentLoaded, speed);           
        }
      }

    function concatArr2Uint8(s) {//Array 2 Uint8Array
        var tmp = [];
        for (var i of s) tmp = tmp.concat(i);
        return new Uint8Array(tmp);
    }

    function Uint8ToBase64(u8Arr, urisafe) {//Uint8Array 2 Base64
        var CHUNK_SIZE = 0x8000; //arbitrary number
        var index = 0;
        var length = u8Arr.length;
        var result = '';
        var slice;
        while (index < length) {
            slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
            result += String.fromCharCode.apply(null, slice);
            index += CHUNK_SIZE;
        }
        return urisafe ? btoa(result).replace(/\//g, '_').replace(/\+/g, '-') : btoa(result);
    }

    function calcEtag() {
        if (!sha1String.length) return 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ';
        var sha1Buffer = concatArr2Uint8(sha1String);
        // 如果大于4M，则对各个块的sha1结果再次sha1
        if (blockCount > 1) {
            prefix = 0x96;
            sha1Buffer = shA1(sha1Buffer.buffer);
        } else {
            sha1Buffer = Array.apply([], sha1Buffer);
        }
        sha1Buffer = concatArr2Uint8([[prefix], sha1Buffer]);
        return Uint8ToBase64(sha1Buffer, true);
    }
    return (calcEtag());
}

var exports = qetag();

if (COMMON_JS) {
  module.exports = exports;
} else {
  root.qetag = exports;
  if (AMD) {
    define(function () {
      return exports;
    });
  }
}

})(sha1);
