import Groq from 'groq-sdk'
import { getKey } from '../utils/keys.js';


// THIS API IS NOT TO BE CONFUSED WITH GROK!
// Go to grok.js for that. :)



// NOTICE: I've moved to an actual custom coding style. Sorry if this seems quite a bit more spaced out than the rest of the classes, as this style places HEAVY emphasis on spacing and
// readability.
// I'm just maintaining my old legacy code.
// Cheers, Kalinite/Copper/FateUnix29/... 

const models_with_tools = [
    ("llama-3.3-70b-versatile", true, true), // Name, has tools, has parallel tools
    ("qwen-2.5-32b", true, true),
    ("deepseek-r1-distill-qwen-32b", true, true),
    ("deepseek-r1-distill-llama-70b", true, true),
    ("llama-3.1-8b-instant", true, true),
    ("mixtral-8x7b-32768", true, false),
    ("gemma2-9b-it", true, false)
]



// Umbrella class for everything under the sun... That GroqCloud provides, that is.
export class GroqCloudAPI {

    constructor(model_name, url, params) {

        this.model_name = model_name || "llama-3.3-70b-versatile";
        this.url = url;
        this.params = params || {};

        // Remove any mention of "tools" from params:
        if (this.params.tools) {
            delete this.params.tools;
        }
        // See the comment after sendRequest's function signature for why (hint: devastating conflicts are possible if not careful!).

        // I'm going to do a sneaky ReplicateAPI theft for a lot of this, aren't I?
        if (this.url) {

            console.warn("GroqCloud has no implementation for custom URLs. Ignoring provided URL.");

        }

        this.groq = new Groq({ apiKey: getKey('GROQCLOUD_API_KEY') });
    }



    async sendRequest(turns, systemMessage, stop_seq=null, tools=null) { // My reasoning for putting tools here and not in params is because they may change.
                                                                         // If the tool calling API use gets so advanced, we might start removing tools from the list temporarily
                                                                         // in order to stop the bot from doing stupid things.

        // SANITY CHECK
        // Is this model in the list of models with tools?
        let model_tool_profile = models_with_tools.find(model => model[0] == this.model_name);

        if (!model_tool_profile) {
            console.warn(`GroqCloud does not have support for any tools on model '${this.model_name}'. Try another model. The GroqCloud API implementation is smart enough to switch back to token-based tools, though.`);
            tools = null; // Absolutely not lol
        }


        let messages = [{"role": "system", "content": systemMessage}].concat(turns); // The standard for GroqCloud is just appending to a messages array starting with the system prompt, but
                                                                                     // this is perfectly acceptable too, and I recommend it. 
                                                                                     // I still feel as though I should note it for any future revisions of MindCraft, though.


        let raw_res = null;
        let res = null;
        let tool_calls = null;

        try {

            console.log("Awaiting Groq response...");

            if (!this.params.max_tokens) {
                this.params.max_tokens = 8000; // Set it lower. This is a common theme.
            }

            let completion = await this.groq.chat.completions.create({
                "messages": messages,
                "model": this.model_name || "llama-3.3-70b-versatile",
                "stream": false, // I'm not trying a stream with tools involved.
                "stop": stop_seq,
                "tools": tools,        // Here comes the big guns.
                "tool_choice": "auto", // Hehehe!... For this parameter in particular, we're just making absolutely sure it can choose to use tools or not.
                ...(this.params || {})
            });

            raw_res = completion.choices[0].message;
            res = raw_res.content
            tool_calls = raw_res.tool_calls;

        }

        catch(err) {

            console.log(err);
            res = "My brain just kinda stopped working. Try again. (Psst, check the MindCraft console!)";

        }

        return res, raw_res, tool_calls; // This will definitely require some exclusive handling.

    }



    async embed(text) {

        console.log("GroqCloud, to my knowledge, does not have support for embeddings. However, the following text was provided: " + text);

    }
}