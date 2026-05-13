// package com.cinex.controller;
// import java.util.ArrayList;
// import java.util.List;

// import org.springframework.web.bind.annotation.DeleteMapping;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.PutMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RestController;

// @RestController
// @RequestMapping("/api")
// public class TestController {
//     // Temporary in-memory list
//     List<String> users = new ArrayList<>();


//     // CREATE
//     @PostMapping("/users")
//     public String createUser(@RequestBody String name) {

//         users.add(name);

//         return "User added: " + name;
//     }

//     @GetMapping("/alive?")
//     public String getHealth() {

//         return "i am alive";
//     }

//     // READ ALL
//     @GetMapping("/users")
//     public List<String> getUsers() {

//         return users;
//     }


//     // READ ONE
//     @GetMapping("/users/{index}")
//     public String getUser(@PathVariable int index) {

//         return users.get(index);
//     }


//     // UPDATE
//     @PutMapping("/users/{index}")
//     public String updateUser(
//             @PathVariable int index,
//             @RequestBody String newName
//     ) {

//         users.set(index, newName);

//         return "Updated successfully";
//     }


//     // DELETE
//     @DeleteMapping("/users/{index}")
//     public String deleteUser(@PathVariable int index) {

//         users.remove(index);

//         return "Deleted successfully";
//     }

// }
