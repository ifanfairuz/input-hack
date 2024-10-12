import $ from "jquery";

declare global {
  interface Window {
    $: typeof $;
  }
}

$.fn.extend({
  hack(
    mapping: Record<
      string,
      number | { key: string; map: number; delay: number }[]
    >,
    delimiter = "||"
  ) {
    const box = $(this);
    const input = $("<input>");
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
        } else {
          const jobs = map.map(
            (m) => () =>
              new Promise<void>((res) => {
                setTimeout(() => {
                  try {
                    box
                      .find(`[name="${m.key}"]`)
                      .val(datas?.[m.map] ?? "")
                      .trigger("change");
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
    });

    box.prepend(input);
  },
});

window.$ = $;
