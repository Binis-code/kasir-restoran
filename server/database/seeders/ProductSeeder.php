<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['id' => 'kopi-susu', 'barcode' => '8991002100015', 'name' => 'Kopi Susu', 'description' => 'Espresso, susu segar, dan gula aren yang lembut.', 'price' => 25000, 'category' => 'Favorit', 'kind' => 'Minuman', 'prep_minutes' => 2, 'badge' => 'Paling laris', 'image' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'roti-panggang-isi', 'barcode' => '8991002100022', 'name' => 'Roti Panggang Isi', 'description' => 'Roti sourdough panggang dengan isian keju dan telur.', 'price' => 42000, 'category' => 'Favorit', 'kind' => 'Makanan', 'prep_minutes' => 8, 'badge' => null, 'image' => 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'kue-lemon', 'barcode' => '8991002100039', 'name' => 'Kue Lemon', 'description' => 'Kue lemon lembut dengan taburan gula halus.', 'price' => 28000, 'category' => 'Camilan', 'kind' => 'Camilan', 'prep_minutes' => 3, 'badge' => null, 'image' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'kopi-hitam', 'barcode' => '8991002100046', 'name' => 'Kopi Hitam', 'description' => 'Seduhan biji arabika pekat tanpa gula.', 'price' => 18000, 'category' => 'Minuman', 'kind' => 'Minuman', 'prep_minutes' => 2, 'badge' => null, 'image' => 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'roti-pagi', 'barcode' => '8991002100053', 'name' => 'Roti Pagi', 'description' => 'Roti bakar mentega hangat untuk pembuka hari.', 'price' => 32000, 'category' => 'Sarapan', 'kind' => 'Makanan', 'prep_minutes' => 6, 'badge' => null, 'image' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'nasi-sayur-panggang', 'barcode' => '8991002100060', 'name' => 'Nasi Sayur Panggang', 'description' => 'Nasi hangat dengan sayuran panggang dan sambal rumahan.', 'price' => 48000, 'category' => 'Makanan', 'kind' => 'Makanan', 'prep_minutes' => 8, 'badge' => 'Pilihan dapur', 'image' => 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'kopi-jeruk-dingin', 'barcode' => '8991002100077', 'name' => 'Kopi Jeruk Dingin', 'description' => 'Kopi dingin dengan perasan jeruk yang menyegarkan.', 'price' => 30000, 'category' => 'Minuman', 'kind' => 'Minuman', 'prep_minutes' => 3, 'badge' => null, 'image' => 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=640&q=70'],
            ['id' => 'potongan-kue-beri', 'barcode' => '8991002100084', 'name' => 'Potongan Kue Beri', 'description' => 'Potongan kue lembut dengan isian buah beri.', 'price' => 27000, 'category' => 'Camilan', 'kind' => 'Camilan', 'prep_minutes' => 3, 'badge' => null, 'image' => 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=640&q=70'],
        ];

        foreach ($items as $item) {
            Product::updateOrCreate(
                ['barcode' => $item['barcode']],
                [...$item, 'id' => null],
            );
        }
    }
}
