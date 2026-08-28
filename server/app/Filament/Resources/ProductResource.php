<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use BackedEnum;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationLabel = 'Produk';

    protected static ?string $modelLabel = 'Produk';

    protected static ?string $pluralModelLabel = 'Produk';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-archive-box';

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('barcode')
                ->label('Barcode')
                ->required()
                ->maxLength(32)
                ->unique(ignoreRecord: true),
            TextInput::make('name')
                ->label('Nama produk')
                ->required()
                ->maxLength(120),
            TextInput::make('description')
                ->label('Deskripsi')
                ->maxLength(500)
                ->columnSpanFull(),
            TextInput::make('price')
                ->label('Harga (Rp)')
                ->numeric()
                ->integer()
                ->minValue(0)
                ->required(),
            Select::make('category')
                ->label('Kategori')
                ->options([
                    'Favorit' => 'Favorit',
                    'Sarapan' => 'Sarapan',
                    'Makanan' => 'Makanan',
                    'Minuman' => 'Minuman',
                    'Camilan' => 'Camilan',
                ])
                ->required(),
            Select::make('kind')
                ->label('Jenis')
                ->options([
                    'Minuman' => 'Minuman',
                    'Makanan' => 'Makanan',
                    'Camilan' => 'Camilan',
                ])
                ->default('Makanan')
                ->required(),
            TextInput::make('prep_minutes')
                ->label('Menit siap')
                ->numeric()
                ->integer()
                ->minValue(0)
                ->default(5),
            TextInput::make('badge')
                ->label('Badge')
                ->maxLength(40),
            TextInput::make('image')
                ->label('URL foto')
                ->url()
                ->maxLength(500)
                ->columnSpanFull(),
            Toggle::make('is_active')
                ->label('Aktif')
                ->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('barcode')
                    ->label('Barcode')
                    ->searchable(),
                TextColumn::make('name')
                    ->label('Nama')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('category')
                    ->label('Kategori')
                    ->badge(),
                TextColumn::make('price')
                    ->label('Harga')
                    ->money('IDR', locale: 'id')
                    ->sortable(),
                IconColumn::make('is_active')
                    ->label('Aktif')
                    ->boolean(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                CreateAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageProducts::route('/'),
        ];
    }
}
