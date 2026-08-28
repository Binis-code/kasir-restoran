<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'barcode',
        'name',
        'description',
        'price',
        'category',
        'kind',
        'prep_minutes',
        'badge',
        'image',
        'is_active',
    ];

    protected $casts = [
        'price' => 'integer',
        'prep_minutes' => 'integer',
        'is_active' => 'boolean',
    ];
}
