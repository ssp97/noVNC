import Websock from "../websock.js";
import Display from "../display.js";

import { H264Decoder as H264Core} from '/vendor/h264decoder/dist/index.js';




export default class H264Decoder {
  // static decodedFrameCount : number = 0;
  // decoder : H264Core;
  // emptyu:Uint8Array|null;
  // emptyv:Uint8Array|null;

  constructor() {
  }

  async init() {
    if(this.decoder == null)
    {
      this.decoder = new H264Core();
      this.emptyu = null;
      this.emptyv = null;
      //await this.decoder.init();
      console.log("h264 init ok~!");
    }
  }

  decodeRect(x, y, width, height, sock, display, depth) {
    //TODO: switch to Webgl display whecurn in x264 mode
    //TODO: instantiate h264 decoder.
    //TODO: receive data, check where decodeRect is called, maybe we need another header sent in server to trigger this
    //   function
    console.log("on h264 decodeRect");

    let startDecode = performance.now();

    const length = sock.rQshift32();
    const flag = sock.rQshift32(); //todo process flag

    const payload = sock.rQshiftBytes(length);
    const result = this.decoder.decode(payload);

    let endDecode = performance.now();
    // StatisticsData.setSessionStat("decodedFrameCount", ++H264Decoder.decodedFrameCount);
    // StatisticsData.setFrameStat("decodeDurationMs", endDecode-startDecode);

    console.log(result);

    if(result === H264Core.PIC_RDY && this.decoder.pic) {
      console.log(`frame decoded. payloadSize=(${length})`);
    } else {
      console.log("decoder error "+result);
    }

    height+=8;
    if (result === 1 && this.decoder.pic) {
      var frame = {
          format: ({
              width: width,
              height: height,
              chromaWidth: width / 2,
              chromaHeight: height / 2,
              cropLeft: 0,
              cropTop: 0,
              cropWidth: width,
              cropHeight: height,
              displayWidth: width,
              displayHeight: height // derived from cropHeight
          }),
          y: {
              bytes: this.decoder.pic.subarray(0, width * height),
              stride: width,
          },
          u: {
              bytes: this.decoder.pic.subarray(width * height, (width * height) + (width * height) / 4),
              stride: width / 2,
          },
          v: {
              bytes: this.decoder.pic.subarray((width * height) + (width * height / 4), (width * height) + (width * height / 4) + (width * height / 4)),
              stride: width / 2,
          }
      };
      console.log(display);
      //display.blitImageWebgl(frame);
      //display.blitImage(0, 0, width, height, this.decoder.pic, false);
      display.blitImageYuv(this.decoder.pic, width, height);
  }

    return true; //important to return true, otherwise receive queue will break.
  }
}