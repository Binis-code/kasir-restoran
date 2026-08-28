<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OrderResource\Pages;
use App\Models\Order;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static ?string $navigationLabel = 'Pesanan';

    protected static ?string $modelLabel = 'Pesanan';

    protected static ?string $pluralModelLabel = 'Pesanan';

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-receipt-percent';

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('status')
                ->label('Status')
                ->options([
                    'disimpan' => 'Disimpan',
                    'siap' => 'Siap',
                    'sudah-dibayar' => 'Sudah dibayar',
                ])
                ->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('no')
                    ->label('Nomor')
                    ->sortable()
                    ->prefix('#'),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'sudah-dibayar' => 'success',
                        'siap' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('order_type')
                    ->label('Tipe')
                    ->formatStateUsing(fn (string $state): string => $state === 'meja' ? 'Meja' : 'Bawa pulang'),
                TextColumn::make('item_count')
                    ->label('Produk')
                    ->numeric()
                    ->alignEnd(),
                TextColumn::make('method')
                    ->label('Metode')
                    ->placeholder('—'),
                TextColumn::make('total')
                    ->label('Total')
                    ->money('IDR', locale: 'id')
                    ->sortable(),
                TextColumn::make('paid_at')
                    ->label('Dibayar')
                    ->dateTime('d M Y H:i', 'Asia/Jakarta')
                    ->placeholder('—'),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->defaultSort('no', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageOrders::route('/'),
        ];
    }
}
