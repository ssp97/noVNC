import Websock from "../websock.js";
import Display from "../display.js";
const work = new Worker("/vendor/libav_h264/dist/main.worker.js");

export default class H264Decoder {

    constructor() {
    }

    async init() {
        if (this.decoder == null) {
            this.decoder = work;
            let that = this;
            this.decoder.addEventListener('message', (e) => {
                if (e.data.type == "pictureReady") {
                    that.display.blitImageYuvOpenGL(e.data.data.yPlane, e.data.data.uPlane, e.data.data.vPlane, e.data.width, e.data.height);
                    that.decoder.postMessage({
                        type: "closeFrame",
                        data: e.data.data.ptr,
                        renderStateId: 0
                    },
                    );
                }
            }, false);
            console.log("h264 init ok~!");
        }
    }

    close() {
        if (this.decoder) {
            console.log("close h264");
            this.decoder.postMessage({
                type: "release",
                renderStateId: 0
            });
        }
    }

    decodeRect(x, y, width, height, sock, display, depth) {
        this.display = display;
        console.log("on h264 decodeRect");

        let startDecode = performance.now();

        const length = sock.rQshift32();
        const flag = sock.rQshift32(); //todo process flag

        const payload = sock.rQshiftBytes(length);
    //const result = this.decoder.decode(payload);

        let endDecode = performance.now();
        console.log("decodeDurationMs ", endDecode-startDecode);

        const payloadArr = new Uint8Array(payload);

        this.decoder.postMessage({
            type: "decode",
            data: payloadArr.buffer,
            offset: payloadArr.byteOffset,
            length: payloadArr.byteLength,
            renderStateId: 0
        }, [payloadArr.buffer],
        );
        return true; //important to return true, otherwise receive queue will break.
    }
}