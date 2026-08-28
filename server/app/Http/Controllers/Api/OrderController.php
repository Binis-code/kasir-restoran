<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'no' => ['required', 'integer', 'unique:orders,no'],
            'status' => ['required', Rule::in(['disimpan', 'siap', 'sudah-dibayar'])],
            'orderType' => ['required', Rule::in(['bawa-pulang', 'meja'])],
            'tableNumber' => ['nullable', 'integer', 'min:1'],
            'guests' => ['nullable', 'integer', 'min:1'],
            'method' => ['nullable', Rule::in(['kartu-qr', 'tunai', 'qris'])],
            'paidAt' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.barcode' => ['required', 'string', 'exists:products,barcode'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ]);

        $order = DB::transaction(function () use ($validated) {
            $subtotal = 0;
            $itemCount = 0;
            $resolved = [];

            foreach ($validated['items'] as $line) {
                $product = Product::query()->where('barcode', $line['barcode'])->firstOrFail();
                $subtotal += $product->price * $line['qty'];
                $itemCount += $line['qty'];
                $resolved[] = ['product' => $product, 'qty' => $line['qty']];
            }

            $tax = (int) round($subtotal * 0.11);

            $order = Order::create([
                'no' => $validated['no'],
                'status' => $validated['status'],
                'order_type' => $validated['orderType'],
                'table_number' => $validated['tableNumber'] ?? null,
                'guests' => $validated['guests'] ?? null,
                'item_count' => $itemCount,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $subtotal + $tax,
                'method' => $validated['method'] ?? null,
                'paid_at' => $validated['paidAt'] ?? null,
            ]);

            foreach ($resolved as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'unit_price' => $line['product']->price,
                    'qty' => $line['qty'],
                ]);
            }

            return $order;
        });

        return response()->json(['data' => ['no' => $order->no, 'total' => $order->total]], 201);
    }
}
