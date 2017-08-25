import Basie, { BaseModel } from "basie";
import { Event } from "./event";
import { Provider } from "./provider";

class _DatabaseEvent extends BaseModel {
    /**
     * Slug of the provider that generated this.
     */
    public provider: string;

    /**
     * The ID of this object, as generated by the provider.
     */
    public provider_id: string;

    /**
     * Title of the event.
     */
    public title: string;

    /**
     * URL of the event.
     */
    public url: string;

    /**
     * Body description of the event.
     */
    public body: string;

    /**
     * The timestamp as given by the provider, or the same as the emit timestamp.
     */
    public timestamp_created: number;

    /**
     * The timestamp when this event was emitted and added to the database.
     */
    public timestamp_emitted: number;

    /**
     * The metadata for this event, or `{}` if not given.
     */
    public metadata_json: string;

    /**
     * Converts this database event to a JSON representation suitable for sending to
     * the client.
     */
    public serialize(): any {
        return {
            id: this.id,
            provider: this.provider,
            title: this.title,
            url: this.url,
            body: this.body,
            timestamps: {
                created: new Date(this.timestamp_created).toISOString(),
                emitted: new Date(this.timestamp_emitted).toISOString()
            },
            metadata: JSON.parse(this.metadata_json)
        };
    }

    /**
     * Creates a new database entry from the specified event. Does not save the entry.
     */
    public static fromEvent(provider: Provider<any>, event: Event): DatabaseEvent {
        const instance = new DatabaseEvent();
        instance.provider = provider.slug;
        instance.provider_id = event.id;
        instance.title = event.title;
        instance.url = event.url;
        instance.body = event.body;
        instance.timestamp_created = event.timestamp ? event.timestamp.getTime() : Date.now();
        instance.timestamp_emitted = Date.now();
        instance.metadata_json = event.metadata ? JSON.stringify(event.metadata) : "{}";
        return instance;
    }
}
export const DatabaseEvent = Basie.wrap<_DatabaseEvent>()(_DatabaseEvent, "events");
export type DatabaseEvent = _DatabaseEvent;