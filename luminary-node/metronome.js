class Metronome {

    constructor(gun) {
        this.gun = gun;
        this.instances = {};
    }

    print() {
        console.log("New metronme")
    }

    init() {

        var self = this;
        let ref = this.gun.get('refl');

        ref.get('instances').map().on(function (resObj, id) {

            try {
                let app = JSON.parse(resObj.path);

                if (app == null) {
                    return
                }

                let processedURL = app.path;
                //get instance for new connection
                var namespace = self.GetNamespace(processedURL);
                if (namespace == undefined) {
                    return;
                }

                let instance = ref.get('instances').get(namespace);

                instance.get('heartbeat').not(function (res) {
                    instance.get('heartbeat').put({ tick: "{}", start_time: 'start_time', rate: '1' }).heartbeat(0.0, 1)

                })


            } catch (e) {
                console.log(e)
            }

        })

    }


    GetNamespace(processedURL) {
        if ((processedURL['instance']) && (processedURL['public_path'])) {
            return this.JoinPath(processedURL['public_path'], processedURL['application'], processedURL['instance']);
        }
        return undefined;
    }

    JoinPath( /* arguments */) {
        var result = "";
        if (arguments.length > 0) {
            if (arguments[0]) {
                result = arguments[0];
            }
            for (var index = 1; index < arguments.length; index++) {
                var newSegment = arguments[index];
                if (newSegment == undefined) {
                    newSegment = "";
                }

                if ((newSegment[0] == "/") && (result[result.length - 1] == "/")) {
                    result = result + newSegment.slice(1);
                } else if ((newSegment[0] == "/") || (result[result.length - 1] == "/")) {
                    result = result + newSegment;
                } else {
                    result = result + "/" + newSegment;
                }
                //result = libpath.join( result, newSegment );
            }
        }
        return result;
    }

}

module.exports = Metronome;