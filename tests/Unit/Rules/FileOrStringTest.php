<?php

use App\Rules\FileOrString;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

uses(TestCase::class);

function fileOrStringErrors(array $data, array $files = []): array
{
    if (! empty($files)) {
        $request = Request::create('/', 'POST', $data, [], $files);
        app()->instance('request', $request);
    } else {
        app()->instance('request', Request::create('/', 'POST', $data));
    }

    return Validator::make($data, ['picture' => [new FileOrString]])
        ->errors()
        ->get('picture');
}

it('accepts a valid uploaded jpeg', function () {
    $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');
    $errors = fileOrStringErrors(['picture' => $file], ['picture' => $file]);
    expect($errors)->toBeEmpty();
});

it('rejects an uploaded file that is too large', function () {
    $file = UploadedFile::fake()->create('huge.jpg', 7000, 'image/jpeg');
    $errors = fileOrStringErrors(['picture' => $file], ['picture' => $file]);
    expect($errors)->not->toBeEmpty();
});

it('accepts a base64-encoded string', function () {
    $errors = fileOrStringErrors(['picture' => base64_encode('hello')]);
    expect($errors)->toBeEmpty();
});

it('accepts a plain string', function () {
    $errors = fileOrStringErrors(['picture' => 'just-a-name.png']);
    expect($errors)->toBeEmpty();
});

it('rejects a non-string non-file value', function () {
    $errors = fileOrStringErrors(['picture' => ['array', 'value']]);
    expect($errors)->not->toBeEmpty();
});
