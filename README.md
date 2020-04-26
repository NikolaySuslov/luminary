# Krestianstvo Luminary

The source code of the current **Luminary** implementation mainly at [LiveCoding.space](https://livecoding.space) project repository:   

- **Krestianstvo Luminary** functional prototype is avaliable to try out at https://livecoding.space  

- **Source code** at [LiveCoding.space GitHub repository **master** branch](https://github.com/NikolaySuslov/livecodingspace)  

- **Research paper** about Krestianstvo Luminary architecture here: [download / read](/paper/Luminary.pdf)

---

## Krestianstvo Luminary for Open Croquet architecture and Virtual World Framework in peer-to-peer Web

Everyone who is familiar with [Croquet architecture](https://en.wikipedia.org/wiki/Croquet_Project) are anticipating (waiting breathless) the updates for Open Croquet architecture from **Croquet V** by David A. Smith and [Croquet Studios](https://croquet.studio)!

However, while working on [LiveCoding.space](https://www.krestianstvo.org/sdk3) project by Krestianstvo.org that is heavily based on [Virtual World Framework](https://en.wikipedia.org/wiki/Virtual_world_framework) (containing elements of Open Croquet architecture), I have started revising the current Reflector server.

Let me introduce to you an ideas and early prototype of the **Krestianstvo Luminary** for Open Croquet architecture and Virtual World Framework. 
**Krestianstvo Luminary** potentially could replace Reflector server in flavour of using offline-first [Gun DB](https://gun.eco/docs/Introduction) pure distributed storage system. That allows instead of ‘Reflecting’ messages with centralised Croquet’s time now, to ‘Shining’ time on every connected node using Gun’s [Hypothetical Amnesia Machine](https://gun.eco/docs/Hypothetical-Amnesia-Machine), running in peer-to-peer Web. Also to secure all external messages streams by using peer-to-peer identities and [SEA](https://gun.eco/docs/SEA) cryptographic library for Gun DB. More over running Luminary on [AXE](https://gun.eco/docs/AXE#faq) blockchain.  
**Krestianstvo Luminary** simply transforms the only server related Croquet’s part - Reflector (taken from VWF version) into the pure peer-to-peer application, running on a client’s Web Browsers.  

| | Croquet&nbsp;Reflector&nbsp;(VWF) | Krestianstvo Luminary |
| --- | :---: | :---: |
| **Architecture:** | Client-Server | Peer-to-Peer |
| **Croquet time stamp:** | on server | on peer |
| **Time now is:** | server machine’s time | GunDB HAM state: combines timestamps, vector clocks, and a conflict resolution algorithm |
| source code | new Date( ).getTime( ) | Gun.state.is ( node, property ) |
| **Heartbeat messages:** | by server | by selected peer |
| **Reflector app logic:** | on server | on peer |
| **Hosting:** | dedicated server with Web Sockets | peer’s Web Browsers connected through Daisy-chain Ad-hoc Mesh-network (for swapping in different transport layers: Web Sockets, WebRTC, etc.) |
| **Securing the streams of messages:** | by server | by peer-to-peer identities |


For those who are not familiar with Open Croquet architecture, just want to mark key principals behind it in simple words. 

![croquet-reflector](/assets/croquet-reflector.jpg)

### Croquet Architecture

Croquet introduced the notion of virtual time for decentralised computations. Thinking on objects as stream of messages, which lead to deterministic computations on every connected node in decentralised network. All computations are done on every node by itself while interpreting an internal queue of messages, which are not replicated to the network. But these queues are synchronised by an external heartbeat messages coming from Reflector - a tiny server. Also any node’s self generated messages, which should be distributed to other nodes are marked as external. They are explicitly routed to the Reflector, where the are stamped with the Reflector’s time now and are returned back to the node itself and all other nodes on the network. 
Reflector is not only used for sending heartbeat messages, stamping external messages, but also it is used for holding the list of connected clients, list of running virtual world instances, bootstrapping new client connections.

### Reflector 

So, in Croquet architecture for decentralised networks, the Reflector while being a very tiny or even being a micro service - it remains a server. 
It uses WebSockets for coordinating clients, world instances, providing ‘now time’ for the clients, reflecting external messages.

Let’s look how it works in Virtual World Framework (VWF). I will use the available open source code from VWF, which I am using in LiveCoding.space project by Krestianstvo.org

That’s a function returning time now by Reflector. Time is getting from a machine, running a Reflector server:
(server code from **lib/reflector.js**)

``` 
function GetNow( ) {
    return new Date( ).getTime( ) / 1000.0;
}
``` 

Then it uses to make a stamp for a virtual world instance:

```
return ( GetNow( ) - this.start_time ) * this.rate
```

Reflector send this time stamps using WebSockets. And on a client side VWF has a method for dispatching: 
(client code from **public/vwf.js**)

```
socket.on( "message", function( message ) {
  var fields = message;
  ….
  fields.time = Number( fields.time );
  fields.origin = "reflector";
  queue.insert( fields, !fields.action );
  ….
```

Look at send and respond methods, where clients use WebSocket to send external messages back to the Reflector:
```
   var message = JSON.stringify( fields );
   socket.send( message );
```


### Luminary

Now, let’s look at how Krestianstvo Luminary could identically replace the Reflector server.

![luminary](/assets/luminary.jpg)

First of all clients are never forced using WebSockets directly from the application itself for sending or receiving messages. Instead Gun DB responds for that functionality internally. All operations which previously relay on WebSocket connection are replaced by subscribing to updates and changes on a Gun DB nodes and properties.
So, instances, clients - are just Gun DB nodes, available to all connected peers. In that scene, the required Reflector’s application logic is moving from the server to the clients. As, every client on any moment of time could get actual information about instance he is connected to, clients on that instance, etc. Just requesting a node on Gun DB.

Now, about time.

Instead of using machine’s new Date().getTime(), Krestianstvo Luminary uses state from Gun’s [Hypothetical Amnesia Machine](https://gun.eco/docs/Hypothetical-Amnesia-Machine), which combines timestamps, vector clocks, and a conflict resolution algorithm. So, every written property on a Gun’s node stamped with HAM. This state is identical for all peers. That’s meaning that we could get this state just on any client.
Taking in consideration that Gun DB guaranteers that, every change on every node or property will be delivered in right order to all peers. We could make a heartbeat node and subscribe peers to it updates.

Here is the code for creating a heartbeat for VWF:

```
Gun.chain.heartbeat = function (time, rate) {
              // our gun instance
              var gun = this;
              gun.put({
                  'start_time': 'start_time',
                  'rate': 1
              }).once(function (res) {
                  // function to start the timer
                  setInterval(function () {
                      let message = {
                          parameters: [],
                          time: 'tick'
                      };
                      gun.get('tick').put(JSON.stringify(message));
                  }, 50);
              })
  
              // return gun so we can chain other methods off of it
              return gun;
          }

```

Client, which start firstly or create a new virtual world instance, create heartbeat node for that instance and run a metronome (that part could be run on Gun DB instance somewhere on the hosting server, for anytime availability):

```
let instance = _LCSDB.get(vwf.namespace_); //
instance.get('heartbeat').put({ tick: "{}" }).heartbeat(0.0, 1);
```

So, every 50 ms, this client will writes to property ‘tick’ the message content, thus changing it, so Gun HAM will move the state for this property, stamping it with the new unique value, from which the Croquet time will be calculated later.
The start time will be the state value of HAM at ‘start_time’ property, of heartbeat node. Please notice, that actual Croquet timestamp is not calculated here, as it was in Reflector server. The timestamp used for the Croquet internal queue of messages will be calculated on reading of ‘tick’ by the VWF client in it’s main application. 

Here is the simplified core version of dispatching ‘tick’ on VWF client main app, just to get the idea: (full code on **public/vwf.js**, links below)

```
let instance = _LCSDB.get(vwf.namespace_);

instance.get('heartbeat').on(function (res) { 
   if(res.tick) {
  let msg = self.stamp(res, start_time, rate);

  queue.insert(fields, !fields.action);

  }
}

this.stamp = function(source, start_time, rate) {

            let message = JSON.parse(source.tick);

            message.state = Gun.state.is(source, 'tick');
            message.start_time = start_time; //Gun.state.is(source, 'start_time');
            message.rate = rate; //source.rate;

            var time = ((message.state - message.start_time)*message.rate)/1000;

            if (message.action == 'setState'){
                time = ((_app.reflector.setStateTime - message.start_time)*message.rate)/1000;
            }
            message.time = Number( time );
            message.origin = “reflector";

            return message
        }

```

The main point here is the calculation of Croquet time using Gun’s HAM state:
```
Gun.state.is ( node, property )
```

for message:
```
message.state = Gun.state.is(source, ‘tick’); // time of updating tick
message.start_time = Gun.state.is(source, ‘start_time'); //start time of the instance heartbeat
message.rate = source.rate;
var time = ((message.state - message.start_time)*message.rate)/1000;
```

So, all peers will calculate exactly the same Croquet time on getting an update from Gun DB,  regardless of the time when they get this update (network delays, etc). 

As you could imagine, sending external messages will be as simple as just writing the message by a peer to an instance heartbeat with a new message’s content. All connected peers and a peer itself will get that message, stamped with Croquet time, while they are subscribed on changes on heartbeat node (look above at **instance.get(‘heartbeat’).on()** definition )
```
instance.get('heartbeat').get('tick').put(JSON.stringify(newMsg));
```

Actually that’s it!

### Conclusions

* Reflector server is no longer required for running virtual worlds (any existed GunDB instance on a network fits, could know nothing about Croquet and clients)
* clients, world instances, connecting logic are hold by a distributed DB
* stamping messages are doing by clients themselves using Gun’s HAM
* one dedicated peer, producing metronome empty messages for moving time forward (could be anywhere)

All advantages that Gun DB provides, could be applicable inside a Croquet Architecture. One of scenarios could be the use of [Gun’s Timegraph](https://gun.eco/docs/Timegraph ). That’s will allow to store and retrieve the history of messages for recording and replaying later. Using SEA Security, Encryption, & Authorization library, will allow to create a highly secure instance’s heartbeats using peer-to-peer identifies and being deplyed anywhere, anytime available on AXE blockchain.

### Issues

For making a fully functional prototype, there are still an issues in porting Reflector application logic to a functional-reactive Gun DB architecture nature. That concerns to the procedure of connecting clients to a running instance. As it is connected with getting/setting instance state, pending messages and then replaying them on a new connected peers. But, all that is not critical, as does not affect the main idea behind Krestianstvo Luminary. 
There are performance issues, as Gun DB is using [RAD storage adapter](https://gun.eco/docs/RAD). But configuring several RAD options could be helpful, concerning **opt.chunk** and **opt.until** (due to RAD or JSON parse time for each chunk).

### Source code

The source code for Luminary is available at [LiveCoding.space GitHub repository](https://github.com/NikolaySuslov/livecodingspace) under the [**master** branch](https://github.com/NikolaySuslov/livecodingspace/tree/master).

The [branch **‘luminary-partial’**](https://github.com/NikolaySuslov/livecodingspace/tree/luminary-partial) contains working prototype of partial Luminary, when one master-client is chosen for reflector logic, it uses **Gun.state()** for stamping messages, as it was done in the original reflector app, and then distribute as updates to other peers through Gun DB.  


Thanks for reading and I will be gladfull if you will share your comments and visions on that.

Nikolai Suslov