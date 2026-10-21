(async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";

  input.addEventListener("change", async () => {
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const backup = JSON.parse(await file.text());

      if (
        backup?.format !== "rugby-discipline-history-backup" ||
        !Array.isArray(backup.records)
      ) {
        throw new Error(
          "Ce fichier n'est pas une sauvegarde valide de l'historique.",
        );
      }

      const database = await new Promise(
        (resolve, reject) => {
          const request = indexedDB.open(
            "rugby-discipline-history",
            1,
          );

          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(
              request.error ??
              new Error("Ouverture IndexedDB impossible."),
            );
        },
      );

      await new Promise((resolve, reject) => {
        const transaction = database.transaction(
          "matches",
          "readwrite",
        );
        const store = transaction.objectStore("matches");

        for (const record of backup.records) {
          if (
            record &&
            typeof record.id === "string" &&
            typeof record.rawJson === "string"
          ) {
            store.put(record);
          }
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(
            transaction.error ??
            new Error("Import de l'historique impossible."),
          );
        transaction.onabort = () =>
          reject(
            transaction.error ??
            new Error("Import interrompu."),
          );
      });

      database.close();

      console.info(
        `${backup.records.length} enregistrement(s) importé(s). Rechargez la page.`,
      );
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Erreur pendant l'import.",
      );
    }
  });

  input.click();
})();