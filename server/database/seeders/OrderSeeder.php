<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $byBarcode = Product::query()->get()->keyBy('barcode');

        $orders = [
            ['no' => 1044, 'status' => 'sudah-dibayar', 'order_type' => 'bawa-pulang', 'method' => 'tunai', 'items' => [['barcode' => '8991002100046', 'qty' => 1]]],
            ['no' => 1045, 'status' => 'disimpan', 'order_type' => 'meja', 'table_number' => 2, 'guests' => 4, 'method' => null, 'items' => [['barcode' => '8991002100015', 'qty' => 2], ['barcode' => '8991002100022', 'qty' => 1], ['barcode' => '8991002100060', 'qty' => 1], ['barcode' => '8991002100039', 'qty' => 1]]],
            ['no' => 1046, 'status' => 'sudah-dibayar', 'order_type' => 'bawa-pulang', 'method' => 'kartu-qr', 'items' => [['barcode' => '8991002100015', 'qty' => 1], ['barcode' => '8991002100084', 'qty' => 1]]],
            ['no' => 1047, 'status' => 'siap', 'order_type' => 'meja', 'table_number' => 4, 'guests' => 2, 'method' => null, 'items' => [['barcode' => '8991002100060', 'qty' => 1], ['barcode' => '8991002100053', 'qty' => 1]]],
        ];

        foreach ($orders as $entry) {
            $subtotal = 0;
            $itemCount = 0;
            $resolved = [];

            foreach ($entry['items'] as $line) {
                $product = $byBarcode->get($line['barcode']);
                if ($product === null) {
                    continue;
                }
                $subtotal += $product->price * $line['qty'];
                $itemCount += $line['qty'];
                $resolved[] = ['product' => $product, 'qty' => $line['qty']];
            }

            $tax = (int) round($subtotal * 0.11);

            $order = Order::updateOrCreate(
                ['no' => $entry['no']],
                [
                    'status' => $entry['status'],
                    'order_type' => $entry['order_type'],
                    'table_number' => $entry['table_number'] ?? null,
                    'guests' => $entry['guests'] ?? null,
                    'item_count' => $itemCount,
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $subtotal + $tax,
                    'method' => $entry['method'],
                    'paid_at' => $entry['status'] === 'sudah-dibayar' ? now() : null,
                ],
            );

            foreach ($resolved as $line) {
                OrderItem::updateOrCreate(
                    ['order_id' => $order->id, 'product_id' => $line['product']->id],
                    ['product_name' => $line['product']->name, 'unit_price' => $line['product']->price, 'qty' => $line['qty']],
                );
            }
        }
    }
}
