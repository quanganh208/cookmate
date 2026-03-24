package com.cookmate.auth.repository;

import com.cookmate.auth.model.AuthProvider;
import com.cookmate.auth.model.User;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByProviderIdAndAuthProvider(String providerId, AuthProvider authProvider);
}
