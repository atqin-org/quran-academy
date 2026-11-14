<?php

test('the root path redirects to the login screen', function () {
    $this->get('/')->assertRedirect(route('login'));
});
