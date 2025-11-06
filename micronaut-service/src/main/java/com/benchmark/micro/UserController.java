package com.benchmark.micro;

import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpResponse;

@Controller
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Get("/health")
    public HttpResponse<String> health() {
        return HttpResponse.ok("OK");
    }

    @Get("/users")
    public Iterable<User> all() {
        return userRepository.findAll();
    }

    @Get("/users/{id}")
    public HttpResponse<User> one(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(HttpResponse::ok)
                .orElse(HttpResponse.notFound());
    }
}
