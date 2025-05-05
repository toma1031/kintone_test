(() => {
  "use strict";
  // Item MasterのアプリID
  // アプリIDはアプリのURLの末尾の番号（https://myappurl.kintone.com/k/7/の7）
  const ITEM_APP_ID = 7;
  
  // 参照
  // https://kintone.dev/en/docs/kintone/rest-api/records/get-records/
  // アイテムコードでItemアプリにある商品在庫情報を取得する関数
  // intone APIを使ってItem Masterアプリから指定されたアイテムコードのレコードを検索
  const getItemStock = async (itemCode) => {
    const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
      app: ITEM_APP_ID,
        // ここでのitem_codeはのItem Masterのフィールドコード
        // 「query」は「探してほしい条件」を伝える
        // フィールドコードを確認する
        // Oders Tracking アプリを開く
        // 「右上の歯車マーク」→「フォーム」を開く
        // 「Item Code」フィールドをクリック
        // 「フィールドコード」を見る（例：item_code, qty）
      query: `item_code = "${itemCode}"`
    });
    // アイテムが見つかったらそのレコードを返し、見つからなければnullを返す
    return res.records.length > 0 ? res.records[0] : null;
  };

  // 参照
  // https://kintone.dev/en/docs/kintone/js-api/events/record-create-events/save-event/
  // 注文登録時に在庫チェック
  kintone.events.on('app.record.create.submit', async (event) => {
    try {
      const record = event.record;
      const itemCode = record.item_code.value;
      const quantity = Number(record.qty.value);
      
      // 在庫情報を取得
      const itemRecord = await getItemStock(itemCode);
      
      // アイテムが存在しない場合
      if (!itemRecord) {
        event.error = '指定されたアイテムが見つかりません。';
        // ↑のevent オブジェクトを見て、error プロパティがあるためレコード保存をキャンセルする
        return event;
      }
      
      // 在庫数を数値型に変える
      const currentStock = Number(itemRecord.stock.value);
      
      // 在庫チェック
      if (currentStock < quantity) {
        event.error = `在庫が不足しています（現在の在庫: ${currentStock}）。`;
        // ↑のevent オブジェクトを見て、error プロパティがあるためレコード保存をキャンセルする
        return event;
      }
      
      // 在庫十分であれば注文を保存
      return event;
    } catch (error) {
      console.error('在庫チェック中にエラーが発生しました:', error);
      event.error = 'システムエラーが発生しました。管理者にお問い合わせください。';
      // ↑のevent オブジェクトを見て、error プロパティがあるためレコード保存をキャンセルする
      return event;
    }
  });

  // 参照
  // https://kintone.dev/en/docs/kintone/js-api/events/record-create-events/save-event/
  // 注文登録成功後に在庫更新
  kintone.events.on('app.record.create.submit.success', async (event) => {
    try {
      const record = event.record;
      const itemCode = record.item_code.value;
      const quantity = Number(record.qty.value);
      
      // 在庫情報を再取得（他のユーザーによる変更を考慮）
      const itemRecord = await getItemStock(itemCode);
      
      if (itemRecord) {
        const currentStock = Number(itemRecord.stock.value);
        const newStock = Math.max(currentStock - quantity, 0);
        
        //参照
        // https://kintone.dev/en/docs/kintone/rest-api/records/update-record/
        // ここで在庫数（stock）をアップデート
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: ITEM_APP_ID,
          // この$idはKintone が裏で管理してる特別な番号なので、Items アプリに「ID」というフィールドを手動で作らなくても、自動で使える
          id: itemRecord.$id.value,
          record: {
            stock: {
              value: newStock
            }
          }
        });
        
        // 成功メッセージ
        alert('注文が完了し、在庫が更新されました！');
      } else {
        // 注文を保存する前の在庫チェック時にはアイテムが存在していたが、注文保存後～在庫更新時の間にそのアイテムが削除された場合の時、
        // もしくは注文保存時には接続が正常だったが、在庫更新時にネットワーク接続が不安定になった場合
        console.error('在庫更新: アイテムが見つかりません');
        alert('注文は完了しましたが、在庫の更新に問題があります。管理者にご連絡ください。');
      }
      // 処理完了
      return event;
    } catch (error) {
      // 他のユーザーが同じレコードを同時に編集していて競合が発生した場合
      // kintoneシステム自体の一時的な障害の場合
      console.error('在庫更新中にエラーが発生しました:', error);
      alert('注文は完了しましたが、在庫の更新に問題があります。管理者にご連絡ください。');
      // 処理完了
      return event;
    }
  });
})();