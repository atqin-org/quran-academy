<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->log_name,
            'description' => $this->description,
            'causer' => $this->causer ? [
                'name' => $this->causer->name,
                'email' => $this->causer->email,
            ] : null,
            'properties' => $this->properties,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
