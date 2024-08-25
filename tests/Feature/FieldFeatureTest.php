<?php

namespace Tests\Feature;

use App\Models\FieldResponse;
use App\Models\Form;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
class FieldFeatureTest extends TestCase
{
    //use RefreshDatabase;
    /**
     * A basic feature test example.
     */
    public function test_relation(): void
    {
        // admin side 
        $form = Form::factory()->create([
            'name' => 'Create Form',
            'description' => 'This for creating a form.',
        ]);

        $form->fields()->create([
            'label' => 'Name',
            'width' => 50,
            'type' => 'text',
            'is_required' => true,
            'order' => 1,
        ]);
        $form->fields()->create([
            'label' => 'Description',
            'width' => 50,
            'type' => 'text',
            'is_required' => true,
            'order' => 2,
        ]);
        // client side 
        $response = FieldResponse::factory()->create([
            'field_id' => $form->fields->first()->id,
            'response_value' => 'Test Name',
        ]);
        $response = FieldResponse::factory()->create([
            'field_id' => $form->fields->last()->id,
            'response_value' => 'Description',
        ]);
      

        // check if exist
        $this->assertDatabaseHas('forms', [
            'name' => 'Test Form',
            'description' => 'This is a test form.',
        ]);
        $this->assertDatabaseHas('fields', [
            'label' => 'First Name',
            'width' => 50,
            'type' => 'text',
            'is_required' => true,
            'order' => 1,
        ]);
        $this->assertDatabaseHas('fields', [
            'label' => 'Last Name',
            'width' => 50,
            'type' => 'text',
            'is_required' => true,
            'order' => 2,
        ]);
    }


    public function test_index(): void{
        $response = $this->get('/');
        $response->assertStatus(200);
    }
    public function test_user_post_response_based_dynamic_data(){
      
        
        $this->post('/add', [
            'name' => "7",
            'description' => 'This is the content of the post.',
        ]);
       
        $this->assertDatabaseHas('forms', [
            'name' => 'Form',
            'description' => 'This is the content of the post.',
        ]);

    }


}
