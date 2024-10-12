import jQuery from "jquery";

declare global {
  interface Window {
    $: typeof jQuery;
    hack: typeof jQuery;
  }

  interface MultipeHackData {
    datas: string[];
    current: number;
  }
}

const $ = window.$ || jQuery;

const setJsonStore = (name: string, data: any) => {
  return window.localStorage.setItem(name, JSON.stringify(data));
};
const getJsonStore = (name: string, defaults: any = {}) => {
  const data = window.localStorage.getItem(name);
  return data && data !== "" ? JSON.parse(data) : defaults;
};

$.fn.extend({
  hack(
    mapping: Record<
      string,
      | number
      | ((datas: string[]) => any)
      | {
          key: string;
          map: number | ((datas: string[]) => any);
          delay: number;
        }[]
    >,
    events?: {
      pre?: (box: any, input: any) => void;
      post?: (box: any, input: any) => void;
      ready?: (box: any, input: any) => void;
    },
    delimiter = "||"
  ) {
    const box = $(this);
    const input = $("<input>");
    events?.pre && events.pre(box, input);
    input.on("change", async (e) => {
      e.preventDefault();
      const datas = input.val()?.toString().split(delimiter);

      for (const key in mapping) {
        const map = mapping[key];
        if (typeof map === "number") {
          box
            .find(`[name="${key}"]`)
            .val(datas?.[map] ?? "")
            .trigger("change");
        } else if (typeof map === "function") {
          box
            .find(`[name="${key}"]`)
            .val(map(datas ?? []))
            .trigger("change");
        } else {
          const jobs = map.map(
            (m) => () =>
              new Promise<void>((res) => {
                const val =
                  typeof m.map === "number"
                    ? datas?.[m.map] ?? ""
                    : m.map(datas ?? []);
                setTimeout(() => {
                  try {
                    box.find(`[name="${m.key}"]`).val(val).trigger("change");
                    res();
                  } catch (error) {
                    console.error(error);
                    res();
                  }
                }, m.delay);
              })
          );

          for await (const job of jobs) {
            job();
          }
        }
      }

      events?.post && events.post(box, input);
    });

    box.prepend(input, $("<hr>"));
    events?.ready && events.ready(box, input);
  },
  multiHack(
    callback?: (
      data: any,
      save: (cb: (d: MultipeHackData) => MultipeHackData) => void
    ) => void,
    storage_name = "HACK_INPUT",
    delimiter = "\n"
  ) {
    const box = $(this);
    const textarea = $("<textarea>");
    const currentInput = $("<input>");
    currentInput.attr("type", "number");

    let data: MultipeHackData = getJsonStore(storage_name, {
      datas: [],
      current: 0,
    });

    const save =
      (data: MultipeHackData) =>
      (cb: (d: MultipeHackData) => MultipeHackData) => {
        setJsonStore(storage_name, cb(data));
      };

    textarea.val(data.datas.join(delimiter));
    currentInput.val(data.current);

    textarea.on("change", (e) => {
      e.preventDefault();
      data.datas = textarea.val()?.toString().split(delimiter) ?? [];
      setJsonStore(storage_name, data);
    });

    currentInput.on("change", (e) => {
      e.preventDefault();
      data.current = parseInt(`${currentInput.val() ?? "0"}`);
      setJsonStore(storage_name, data);
    });

    const btn = $("<button>");
    btn.html("RUN!");
    btn.on("click", (e) => {
      e.preventDefault();

      if (callback && data.datas.length > data.current) {
        callback(data.datas[data.current], save(data));
      }
    });
    box.prepend(textarea, currentInput, btn, $("<hr>"));

    setTimeout(() => {
      btn.trigger("click");
    }, 200);
  },
});

window.hack = $;
