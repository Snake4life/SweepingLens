import { Database } from "sqlite3";
import Basie from "basie";
import http = require("http");
import express = require("express");
import WebSocket = require("uws");
import { Server as WebSocketServer } from "uws";
import ProviderContext from "./provider-context";
import { Provider } from "./provider";
import { DatabaseEvent } from "./database";
import { WSEvent } from "./ws-event";

export default class SweepingLens {
    private app = express();
    private server = http.createServer(this.app);
    private wss = new WebSocketServer({ server: this.server });
    private peers: WebSocket[] = [];

    private providerContexts: ProviderContext<any>[] = [];

    constructor() {
        Basie.sqlite(new Database("./data/sweeping_lens.db"));

        this.wss.on("connection", socket => {
            console.log("got connection");
            this.peers.push(socket);

            socket.on("close", () => {
                this.peers.splice(this.peers.indexOf(socket), 1);
            });
        });

        this.app.get("/events", (req, res) => this.loadEvents(req, res));
    }

    /**
     * Adds a new provider to the current lens instance. The provider's constructor
     * will immediately fire.
     */
    public registerProvider(provider: Provider<any>) {
        const ctx = new ProviderContext(this, provider);
        this.providerContexts.push(ctx);
        provider.constructor(ctx);
    }

    /**
     * Broadcasts the specified JSON object to all connected peers.
     */
    public broadcast(obj: WSEvent) {
        this.peers.forEach(peer => {
            if (peer.readyState !== WebSocket.OPEN) return;
            peer.send(JSON.stringify(obj));
        });
    }

    /**
     * Starts the server on the specified port.
     */
    public startup(port: number) {
        this.server.listen(port);
        console.log(`[+] Running at 0.0.0.0:${port}... ^C to exit.`);
    }

    /**
     * Handles the GET /events path that loads all events.
     */
    private loadEvents = async (req: express.Request, res: express.Response) => {
        const providers = req.query.providers ? req.query.providers.split(",") : [];
        const perPage = req.query.per_page ? +req.query.per_page : 25;
        const maxId = req.query.max_id ? +req.query.max_id : null;

        const builder = DatabaseEvent.orderByDesc("id").limit(perPage);
        for (const provider of providers) builder.orWhere("provider", provider);
        if (maxId) builder.where("id", "<", maxId);

        const results = await builder.get();
        res.json(results.map(x => x.serialize()));
    };
}