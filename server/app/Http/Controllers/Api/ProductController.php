<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Product::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (Product $p) => [
                    'id' => $p->barcode,
                    'barcode' => $p->barcode,
                    'name' => $p->name,
                    'description' => $p->description,
                    'price' => $p->price,
                    'category' => $p->category,
                    'kind' => $p->kind,
                    'prepMinutes' => $p->prep_minutes,
                    'badge' => $p->badge,
                    'image' => $p->image,
                ]),
        ]);
    }
}
