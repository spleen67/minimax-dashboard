// code a coller dans la console du navigateur pour exporter les données de l’IndexedDB

(async () => {
  const databaseName = "rugby-discipline-history";
  const storeName = "matches";

  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Ouverture IndexedDB impossible."));
  });

  const records = await new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Lecture IndexedDB impossible."));
  });

  database.close();

  const backup = {
    format: "rugby-discipline-history-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type: "application/json;charset=utf-8",
    },
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `rugby-history-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  console.info(
    `${records.length} match(s) exporté(s) depuis IndexedDB.`,
  );
})();